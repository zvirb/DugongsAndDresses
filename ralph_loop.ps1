<#
.SYNOPSIS
    Ralph Wiggum Loop v3 - "I'm helping!" (Conglomerate Edition)
    
.DESCRIPTION
    An enhanced iterative loop for building the Phoenix Frontend Vision.
    It reads `docs/plan.md`, finds the next task, and delegates it to the AI agent.
    It includes specific logic for "Reference UI" context injection.
    
.EXAMPLE
    .\ralph_loop.ps1 -PlanFile "docs/plan.md" -AutoCommit $true
#>

param (
    [string]$PlanFile = "docs/plan.md",
    [bool]$AutoCommit = $true
)

$AbsolutePath = Join-Path (Get-Location) $PlanFile
$ProjectRoot = Get-Location
$ReferenceDir = Join-Path $ProjectRoot "docs\referenceUInew"

# Track retries to prevent infinite failure loops
$global:TaskRetries = @{}

function Get-ReferenceContext {
    param([string]$TaskDescription)
    
    # Try to find a matching folder in referenceUInew based on task keywords
    if (Test-Path $ReferenceDir) {
        $dirs = Get-ChildItem -Path $ReferenceDir -Directory
        foreach ($dir in $dirs) {
            # Simple keyword matching: if the dir name is in the task text
            # E.g. "Energy Grid" task matches "a2ui_energy_grid_widget_1"
            $normalizedTask = $TaskDescription -replace "[^a-zA-Z0-9]", "" -replace " ", ""
            $normalizedDir = $dir.Name -replace "[^a-zA-Z0-9]", "" -replace "_", ""
            
            if ($normalizedDir -match $normalizedTask -or $normalizedTask -match $normalizedDir) {
                Write-Host "[Context] Matched Reference UI: $($dir.Name)" -ForegroundColor Cyan
                return "REFERENCE UI FOUND: I have found a relevant UI prototype at 'docs/referenceUInew/$($dir.Name)'. You MUST read 'code.html' in that directory and use it as the source of truth for the implementation."
            }
        }
    }
    return ""
}

Write-Host "Starting Ralph Wiggum Loop (Conglomerate Edition)..." -ForegroundColor Cyan
Write-Host "Target Plan: $AbsolutePath" -ForegroundColor Gray

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
    
    # 1. FIND NEXT UNCHECKED TASK
    foreach ($line in $content) {
        if ($line -match "^\s*[-\*]\s*\[\s*\]\s*(.+)$") {
            $targetTask = $matches[1].Trim()
            break 
        }
    }

    if ($targetTask) {
        # Check Retries
        if (-not $global:TaskRetries.ContainsKey($targetTask)) {
            $global:TaskRetries[$targetTask] = 0
        }
        
        if ($global:TaskRetries[$targetTask] -ge 3) {
            Write-Host "Skipping Task (Too many failures): $targetTask" -ForegroundColor Red
            # Mark as skipped in file? Or just log? For now, we wait longer.
            Start-Sleep -Seconds 60
            continue
        }

        Write-Host "`n[Ralph] Iteration $($global:TaskRetries[$targetTask] + 1) for Task: $targetTask" -ForegroundColor Yellow
        
        # 2. PREPARE CONTEXT
        $refContext = Get-ReferenceContext -TaskDescription $targetTask
        
        # 3. CONSTRUCT PROMPT
        $metaInstructions = "SYSTEM CONTEXT: You are an autonomous frontend engineer working in '$ProjectRoot'. " +
                            "$refContext " +
                            "YOUR GOAL: Complete the task: '$targetTask'. " +
                            "STYLE GUIDE: Use the 'Agent Mesh' design system (Neon Blue #2b2bee, Dark Navy #101022, Space Grotesk font). " +
                            "IMPORTANT: You must modify the code/files to complete the task. " +
                            "COMPLETION PROTOCOL: When finished, you MUST read '$AbsolutePath' and mark the task as done by changing '- [ ] $targetTask' to '- [x] $targetTask'. " +
                            "If you fail to mark it as done, the loop will repeat."

        # Sanitize prompt to avoid command-line parsing issues with double quotes
        $metaInstructions = $metaInstructions -replace '"', "'"

        Write-Host "Running Agent..." -ForegroundColor DarkMagenta
        
        # 4. EXECUTE AGENT
        try {
            $start = Get-Date
            $geminiArgs = @(
                "--approval-mode=yolo",
                "--prompt", $metaInstructions
            )
            
            Write-Host "Debug: Calling gemini with $($geminiArgs.Count) arguments." -ForegroundColor DarkGray
            # Write-Host "Debug: Prompt length: $($metaInstructions.Length)" -ForegroundColor DarkGray
            
            # Bypass the gemini.ps1 wrapper to avoid argument quoting issues
            $geminiCliPath = "$env:APPDATA\npm\node_modules\@google\gemini-cli\dist\index.js"
            & node $geminiCliPath @geminiArgs
            
            $duration = (Get-Date) - $start
            
            # Check if task was actually marked done
            $newContent = Get-Content $AbsolutePath
            $isDone = $false
            $escapedTask = [regex]::Escape($targetTask)
            foreach ($line in $newContent) {
                if ($line -match "^\s*[-\*]\s*\[x\]\s*$escapedTask") {
                    $isDone = $true
                    break
                }
            }

            if ($isDone) {
                Write-Host "Task Completed in $($duration.TotalSeconds)s!" -ForegroundColor Green
                $global:TaskRetries.Remove($targetTask) # Clear retry count
                
                if ($AutoCommit) {
                    git add .
                    # Only commit if there are changes to avoid empty commit errors
                    if ($(git status --porcelain)) {
                        git commit -m "Ralph: Completed '$targetTask'" | Out-Null
                        Write-Host "[Git] Changes committed." -ForegroundColor DarkGray
                    }
                    
                    Write-Host "[Git] Syncing with remote..." -ForegroundColor DarkGray
                    git pull --rebase origin main
                    git push origin main
                    Write-Host "[Git] State saved and synced." -ForegroundColor Green
                }
            } else {
                Write-Host "Agent finished but task is NOT marked done in plan.md." -ForegroundColor Red
                $global:TaskRetries[$targetTask]++
            }
        }
        catch {
            Write-Host "Execution Error: $_" -ForegroundColor Red
            $global:TaskRetries[$targetTask]++
        }

        Start-Sleep -Seconds 2
    }
    else {
        # Check if we have any completed tasks to reset
        $currentContent = Get-Content $AbsolutePath
        $hasCompletedTasks = $false
        foreach ($line in $currentContent) {
            if ($line -match "^\s*[-\*]\s*\[x\]") {
                $hasCompletedTasks = $true
                break
            }
        }

        if ($hasCompletedTasks) {
             Write-Host "`n[Ralph] All tasks completed! Resetting plan for next loop..." -ForegroundColor Cyan
             $resetContent = $currentContent -replace "\[x\]", "[ ]"
             Set-Content -Path $AbsolutePath -Value $resetContent
             Write-Host "[Ralph] Plan reset. Restarting loop..." -ForegroundColor Green
             Start-Sleep -Seconds 2
        } else {
             Write-Host "`r[Ralph] All tasks checked. Waiting for new tasks..." -NoNewline -ForegroundColor DarkGray
             Start-Sleep -Seconds 5
        }
    }
}