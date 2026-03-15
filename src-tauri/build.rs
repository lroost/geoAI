fn main() {
    tauri_build::build();

    let node_path = detect_path("node");
    println!("cargo:rustc-env=NODE_PATH={}", node_path);

    let ollama_path = detect_path("ollama");
    println!("cargo:rustc-env=OLLAMA_PATH={}", ollama_path);

    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let project_dir = std::path::Path::new(&manifest_dir)
        .parent()
        .expect("Could not resolve project directory")
        .to_string_lossy()
        .to_string();
    println!("cargo:rustc-env=PROJECT_DIR={}", project_dir);
}

fn detect_path(name: &str) -> String {
    let output = std::process::Command::new("which")
        .arg(name)
        .output()
        .unwrap_or_else(|_| panic!("{} not found in PATH", name));

    String::from_utf8(output.stdout)
        .unwrap_or_else(|_| panic!("Invalid path for {}", name))
        .trim()
        .to_string()
}
