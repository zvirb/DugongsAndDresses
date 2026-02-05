<#
.SYNOPSIS
    Ralph Wiggum Loop v2 - "I'm a unit test!"
    
.DESCRIPTION
    An enhanced iterative loop that executes tasks from a plan, commits changes to Git,
    and maintains fresh context for the agent.
    
    Principles from the "Ralph Wiggum Technique":
    1. Loop until done.
    2. Fresh context every run (CLI ensures this).
    3. Persistent state via Files & Git.
    
.EXAMPLE
    .\ralph_loop.ps1 -PlanFile "docs/plan.md" -AutoCommit $true
#>

param (
    [string]$PlanFile = "docs/plan.md",
    [bool]$AutoCommit = $true
)

# Resolve absolute path
$AbsolutePath = Join-Path (Get-Location) $PlanFile
$ProjectRoot = Get-Location

function Get-ProjectContext {
    # Lightweight context gathering to help the stateless agent
    $files = Get-ChildItem -Recurse -Depth 2 -File | Where-Object { $_.Name -notmatch "git|node_modules|ralph_loop" } | Select-Object -ExpandProperty Name
    return "Current Project Files: $($files -join ', ')"
}

Write-Host "Starting Ralph Wiggum Loop (Enhanced)..." -ForegroundColor Cyan
Write-Host "Target Plan: $AbsolutePath" -ForegroundColor Gray

# Ensure git is ready if needed
if ($AutoCommit) {
    git init | Out-Null
    Write-Host "Git persistence enabled." -ForegroundColor DarkGray
}

while ($true) {
    if (-not (Test-Path $AbsolutePath)) {
        Write-Host "Error: Plan file not found. Waiting..." -ForegroundColor Red
        Start-Sleep -Seconds 5
        continue
    }

    $content = Get-Content $AbsolutePath
    $targetTask = $null
    
    # 1. FIND TASK
    foreach ($line in $content) {
        if ($line -match "^\s*[-\*]\s*\[\s*\]\s*(.+)$") {
            $targetTask = $matches[1].Trim()
            break 
        }
    }

    if ($targetTask) {
        Write-Host "`n[Ralph] Found Task: $targetTask" -ForegroundColor Yellow
        
        # 2. PREPARE CONTEXT
        $context = Get-ProjectContext
        
        # 3. CONSTRUCT ROBUST PROMPT
        # We explicitly tell Gemini to:
        # A) Do the work
        # B) Update the plan file (CRITICAL for loop progression)
        $metaInstructions = "SYSTEM CONTEXT: You are an autonomous agent working in '$ProjectRoot'. $context " +
                            "YOUR GOAL: Complete the task: '$targetTask'. " +
                            "IMPORTANT: You must modifying the code/files to complete the task. " +
                            "COMPLETION PROTOCOL: When finished, you MUST read '$AbsolutePath' and mark the task as done by changing '- [ ] $targetTask' to '- [x] $targetTask'. " +
                            "If you fail to mark it as done, I will ask you to do it again forever."

        Write-Host "Running Agent..." -ForegroundColor DarkMagenta
        
        # 4. EXECUTE AGENT (Fresh Context)
        try {
            $start = Get-Date
            & gemini --yolo "$metaInstructions"
            $duration = (Get-Date) - $start
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Agent finished in $($duration.TotalSeconds)s." -ForegroundColor Green
                
                # 5. PERSIST STATE (Git)
                if ($AutoCommit) {
                    git add .
                    git commit -m "Ralph: Completed '$targetTask'" | Out-Null
                    Write-Host "[Git] State saved." -ForegroundColor DarkGray
                }
            } else {
                Write-Host "Agent crashed (Exit Code: $LASTEXITCODE). Retrying..." -ForegroundColor Red
            }
        }
        catch {
            Write-Host "Execution Error: $_" -ForegroundColor Red
        }

        # Short cool-down
        Start-Sleep -Seconds 2
    }
    else {
        # 6. IDLE STATE
        Write-Host "`r[Ralph] All tasks checked. Waiting for new tasks..." -NoNewline -ForegroundColor DarkGray
        Start-Sleep -Seconds 5
    }
}
