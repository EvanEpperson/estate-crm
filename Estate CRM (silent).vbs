' Launches the CRM with no visible terminal window.
' Downside: you can't close it to stop the server — use Stop CRM.bat for that.
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "cmd /c npm start", 0, False
WScript.Sleep 3000
WshShell.Run "http://localhost:3000"
