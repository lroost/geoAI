import { exec } from "node:child_process"
import os from "node:os"
import { promisify } from "node:util"

const execAsync = promisify(exec)
const platform = os.platform()

export async function POST() {
    try {
        let selectedPath = ""

        if (platform === "darwin") {
            const { stdout } = await execAsync(
                `osascript -e 'tell app "Finder" to POSIX path of (choose folder with prompt "Arbeitsverzeichnis wählen:")'`,
                { timeout: 60_000 },
            )
            selectedPath = stdout.trim()
        } else if (platform === "win32") {
            const { stdout } = await execAsync(
                `powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description = 'Arbeitsverzeichnis waehlen'; if ($d.ShowDialog() -eq 'OK') { Write-Output $d.SelectedPath }"`,
                { timeout: 60_000 },
            )
            selectedPath = stdout.trim()
        } else {
            // Linux: zenity als Standard-Dialog
            const { stdout } = await execAsync(
                `zenity --file-selection --directory --title="Arbeitsverzeichnis wählen"`,
                { timeout: 60_000 },
            )
            selectedPath = stdout.trim()
        }

        if (!selectedPath) return Response.json({ cancelled: true })
        return Response.json({ path: selectedPath })
    } catch (e: unknown) {
        const err = e as { message?: string }
        if (
            err.message?.includes("User canceled") ||
            err.message?.includes("cancelled") ||
            err.message?.includes("cancel")
        ) {
            return Response.json({ cancelled: true })
        }
        // Picker nicht verfügbar → graceful fallback
        return Response.json(
            { error: "Kein Dialog verfügbar. Bitte Pfad manuell eingeben.", unavailable: true },
            { status: 422 },
        )
    }
}
