; installer/windows/IntelliLabGC.iss
; Inno Setup script for IntelliLab GC
; Professional GC instrumentation software installer

#define MyAppName "IntelliLab GC"
#define MyAppVersion "1.0.2"
#define MyAppPublisher "IntelliLab"
#define MyAppURL "https://intellilab.local"
#define InstallRoot "{pf}\IntelliLabGC"
#define DataDir "C:\IntelliLab_GC\Data"
#define ScriptsDir "{app}\scripts"
#define StartCmd "{app}\scripts\start_local.cmd"
#define LicenseFile ""

[Setup]
; Unique GUID for this application - change if you fork this project
AppId={{C4D7E7A8-9C0B-46B4-8C33-5B1C6C8E02F1}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={#InstallRoot}
DisableDirPage=no
DefaultGroupName=IntelliLab
DisableProgramGroupPage=no
OutputDir=.
OutputBaseFilename=IntelliLabGC_Setup_{#MyAppVersion}
Compression=lzma
SolidCompression=yes
; Only 64-bit systems supported (modern Python/Node.js requirement)
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
; Requires admin privileges to install to Program Files and create data directory
PrivilegesRequired=admin
DisableReadyMemo=no
SetupLogging=yes
DisableWelcomePage=no
UsePreviousLanguage=no
UninstallDisplayIcon={app}\frontend\public\IntelliLab_GC_logo.png
; Uncomment and provide license file path if needed
;LicenseFile={#LicenseFile}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked
Name: "autorun"; Description: "Create a Start Menu shortcut to &Start IntelliLab GC"; GroupDescription: "Shortcuts:"

[Files]
; Core application files - adjust paths relative to this .iss file's location
; Frontend React application
Source: "..\..\frontend\*"; DestDir: "{app}\frontend"; Flags: recursesubdirs createallsubdirs ignoreversion
; Backend FastAPI application
Source: "..\..\backend\*"; DestDir: "{app}\backend"; Flags: recursesubdirs createallsubdirs ignoreversion
; Common utilities and tools
Source: "..\..\common\*"; DestDir: "{app}\common"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "..\..\core\*"; DestDir: "{app}\core"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "..\..\tools\*"; DestDir: "{app}\tools"; Flags: recursesubdirs createallsubdirs ignoreversion
; Configuration files
Source: "..\..\config\*"; DestDir: "{app}\config"; Flags: recursesubdirs createallsubdirs ignoreversion
; Startup scripts
Source: "..\..\scripts\start_local.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "..\..\scripts\start_local.cmd"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "..\..\scripts\setup_environment.py"; DestDir: "{app}\scripts"; Flags: ignoreversion
; Diagnostic and maintenance scripts
Source: "..\..\scripts\post_install_smoke.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "..\..\scripts\collect_diagnostics.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "..\..\scripts\install_firewall_rules.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "..\..\scripts\install_scheduled_tasks.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "..\..\scripts\sqlite_maint.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "..\..\scripts\backup_database.py"; DestDir: "{app}\scripts"; Flags: ignoreversion
; Python requirements
Source: "..\..\requirements.txt"; DestDir: "{app}"; Flags: ignoreversion
; Documentation
Source: "..\..\README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\STARTUP_GUIDE.md"; DestDir: "{app}"; Flags: ignoreversion
; Application icons
Source: "..\..\frontend\public\IntelliLab_GC_logo.png"; DestDir: "{app}\frontend\public"; Flags: ignoreversion
Source: "..\..\frontend\public\IntelliLab_GC_logo.jpg"; DestDir: "{app}\frontend\public"; Flags: ignoreversion
Source: "..\..\frontend\public\logo192.png"; DestDir: "{app}\frontend\public"; Flags: ignoreversion
Source: "..\..\frontend\public\logo512.png"; DestDir: "{app}\frontend\public"; Flags: ignoreversion
; Offline installation assets
Source: "..\..\installer\wheels\*"; DestDir: "{app}\installer\wheels"; Flags: recursesubdirs createallsubdirs ignoreversion
; Prebuilt frontend (if available)
Source: "..\..\frontend\dist\*"; DestDir: "{app}\frontend\dist"; Flags: recursesubdirs createallsubdirs ignoreversion external skipifsourcedoesntexist
Source: "..\..\frontend\build\*"; DestDir: "{app}\frontend\build"; Flags: recursesubdirs createallsubdirs ignoreversion external skipifsourcedoesntexist

[Dirs]
; Application directories that should be created
Name: "{app}\logs"; Flags: uninsalwaysuninstall
Name: "{app}\backups"; Flags: uninsalwaysuninstall
Name: "{app}\uploads"; Flags: uninsalwaysuninstall
Name: "{app}\reports"; Flags: uninsalwaysuninstall
Name: "{app}\cache"; Flags: uninsalwaysuninstall
Name: "{app}\cache\pip"; Flags: uninsalwaysuninstall
Name: "{app}\cache\npm"; Flags: uninsalwaysuninstall
; Data directory - preserved on uninstall to keep user data
Name: "{code:GetDataDir}"; Flags: uninsneveruninstall
Name: "{code:GetDataDir}\backups"; Flags: uninsneveruninstall
Name: "{code:GetDataDir}\uploads"; Flags: uninsneveruninstall
Name: "{code:GetDataDir}\reports"; Flags: uninsneveruninstall

[Icons]
; Start Menu shortcuts
Name: "{group}\IntelliLab GC"; Filename: "{code:GetStartCmd}"; WorkingDir: "{app}"; IconFilename: "{app}\frontend\public\IntelliLab_GC_logo.png"
Name: "{group}\IntelliLab GC Documentation"; Filename: "{app}\README.md"; WorkingDir: "{app}"
Name: "{group}\Startup Guide"; Filename: "{app}\STARTUP_GUIDE.md"; WorkingDir: "{app}"
Name: "{group}\Uninstall IntelliLab GC"; Filename: "{uninstallexe}"
; Desktop shortcut (optional)
Name: "{commondesktop}\IntelliLab GC"; Filename: "{code:GetStartCmd}"; Tasks: desktopicon; WorkingDir: "{app}"; IconFilename: "{app}\frontend\public\IntelliLab_GC_logo.png"

[Run]
; Post-installation actions
; Note: The actual Python venv setup and dependency installation happens on first launch via start_local.ps1
; This keeps the installer fast and handles different Python environments gracefully

; Offer to launch after installation
Filename: "{code:GetStartCmd}"; Description: "Launch {#MyAppName}"; Flags: postinstall nowait skipifsilent

[UninstallDelete]
; Clean up generated files but preserve user data
Type: filesandordirs; Name: "{app}\logs"
Type: filesandordirs; Name: "{app}\venv"
Type: files; Name: "{app}\*.log"
Type: files; Name: "{app}\*.tmp"
; Note: Data directory at {code:GetDataDir} is intentionally preserved

[Code]
{ Pascal script functions for dynamic values }

function GetDataDir(Param: string): string;
{ Returns the data directory path }
begin
  Result := ExpandConstant('{#DataDir}');
end;

function GetStartCmd(Param: string): string;
{ Returns the startup command path }
begin
  Result := ExpandConstant('{app}\scripts\start_local.cmd');
end;

procedure CurStepChanged(CurStep: TSetupStep);
{ Handle installation steps }
var
  DataDirPath: string;
begin
  if CurStep = ssInstall then
  begin
    { Create data directory during installation }
    DataDirPath := GetDataDir('');
    if not DirExists(DataDirPath) then
    begin
      if not ForceDirectories(DataDirPath) then
      begin
        MsgBox('Could not create data directory: ' + DataDirPath + #13#10 + 
               'Please ensure you have sufficient permissions or create this directory manually after installation.', 
               mbError, MB_OK);
      end
      else
      begin
        { Data directory created successfully }
      end;
    end;
  end;
end;

function InitializeSetup(): Boolean;
{ Pre-installation checks }
var
  PythonVersion: string;
  NodeVersion: string;
  ResultCode: Integer;
begin
  Result := True;
  
  { Check for Python }
  if not Exec('python', '--version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    if MsgBox('Python was not found on this system.' + #13#10 + 
              'IntelliLab GC requires Python 3.8 or later.' + #13#10 + 
              'Would you like to continue with the installation anyway?' + #13#10 + 
              '(You can install Python later and run the application)', 
              mbConfirmation, MB_YESNO) = IDNO then
    begin
      Result := False;
      Exit;
    end;
  end;
  
  { Check for Node.js }
  if not Exec('node', '--version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    if MsgBox('Node.js was not found on this system.' + #13#10 + 
              'IntelliLab GC requires Node.js 14 or later.' + #13#10 + 
              'Would you like to continue with the installation anyway?' + #13#10 + 
              '(You can install Node.js later and run the application)', 
              mbConfirmation, MB_YESNO) = IDNO then
    begin
      Result := False;
      Exit;
    end;
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
{ Handle uninstallation }
begin
  if CurUninstallStep = usPostUninstall then
  begin
    { Inform user about preserved data }
    MsgBox('IntelliLab GC has been uninstalled.' + #13#10 + #13#10 +
           'Your data files have been preserved at:' + #13#10 +
           GetDataDir('') + #13#10 + #13#10 +
           'You can safely delete this directory if you no longer need your IntelliLab GC data.',
           mbInformation, MB_OK);
  end;
end;
