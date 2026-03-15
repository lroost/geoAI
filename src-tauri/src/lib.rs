use std::net::TcpStream;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};
use tauri::Manager;

const NODE: &str = env!("NODE_PATH");
const OLLAMA: &str = env!("OLLAMA_PATH");
const PROJECT_DIR: &str = env!("PROJECT_DIR");

struct ManagedProcesses {
    ollama: Option<Child>,
    nextjs: Option<Child>,
}

fn is_port_open(port: u16) -> bool {
    TcpStream::connect_timeout(
        &format!("127.0.0.1:{}", port).parse().unwrap(),
        Duration::from_millis(300),
    )
    .is_ok()
}

fn wait_for_port(port: u16, timeout: Duration) -> bool {
    let start = Instant::now();
    while start.elapsed() < timeout {
        if is_port_open(port) {
            return true;
        }
        thread::sleep(Duration::from_millis(500));
    }
    false
}

fn start_ollama() -> Option<Child> {
    if is_port_open(11434) {
        log::info!("Ollama läuft bereits auf Port 11434");
        return None;
    }

    log::info!("Starte Ollama …");
    let child = Command::new(OLLAMA)
        .arg("serve")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| log::error!("Ollama konnte nicht gestartet werden: {}", e))
        .ok();

    if child.is_some() && wait_for_port(11434, Duration::from_secs(15)) {
        log::info!("Ollama bereit");
    }

    child
}

fn start_nextjs() -> Option<Child> {
    log::info!("Starte Next.js Server …");
    let next_bin = format!("{}/node_modules/.bin/next", PROJECT_DIR);

    Command::new(NODE)
        .args([&next_bin, "start"])
        .current_dir(PROJECT_DIR)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| log::error!("Next.js konnte nicht gestartet werden: {}", e))
        .ok()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .setup(|app| {
            app.manage(Mutex::new(ManagedProcesses {
                ollama: None,
                nextjs: None,
            }));

            let handle = app.handle().clone();

            thread::spawn(move || {
                let ollama = start_ollama();
                {
                    let state = handle.state::<Mutex<ManagedProcesses>>();
                    state.lock().unwrap().ollama = ollama;
                }

                let nextjs = if cfg!(debug_assertions) {
                    log::info!("Dev-Modus: Next.js wird von beforeDevCommand gestartet");
                    None
                } else {
                    start_nextjs()
                };
                {
                    let state = handle.state::<Mutex<ManagedProcesses>>();
                    state.lock().unwrap().nextjs = nextjs;
                }

                log::info!("Warte auf Next.js Server (Port 3000) …");
                if wait_for_port(3000, Duration::from_secs(30)) {
                    log::info!("Next.js Server bereit – lade App");
                    if let Some(window) = handle.get_webview_window("main") {
                        let _ = window
                            .eval("window.location.replace('http://localhost:3000')");
                    }
                } else {
                    log::error!("Next.js Server nicht rechtzeitig gestartet");
                    if let Some(window) = handle.get_webview_window("main") {
                        let _ = window.eval(
                            "document.querySelector('.spinner').style.display='none';\
                             document.querySelector('.status').style.color='#ef4444';\
                             document.querySelector('.status').textContent='Server konnte nicht gestartet werden.';",
                        );
                    }
                }
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Fehler beim Erstellen der Tauri-Anwendung");

    app.run(|handle, event| {
        if let tauri::RunEvent::Exit = event {
            let state = handle.state::<Mutex<ManagedProcesses>>();
            let mut procs = state.lock().unwrap();

            if let Some(ref mut child) = procs.nextjs {
                log::info!("Beende Next.js Server …");
                let _ = child.kill();
                let _ = child.wait();
            }
            if let Some(ref mut child) = procs.ollama {
                log::info!("Beende Ollama …");
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    });
}
