#!/usr/bin/env python3
import subprocess
import sys
import os

def run_command(cmd):
    """Run a command and return the result"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def clean_git_history():
    """Clean git history to remove secrets"""
    print("Cleaning git history to remove secrets...")
    
    # Create a backup branch
    success, stdout, stderr = run_command("git branch backup-before-cleanup")
    if success:
        print("✓ Created backup branch: backup-before-cleanup")
    else:
        print("⚠ Warning: Could not create backup branch")
    
    # Use git-filter-repo to remove secrets
    # This will rewrite the entire history
    filter_cmd = [
        "git-filter-repo",
        "--path backend/.env",
        "--invert-paths",
        "--force"
    ]
    
    print("Running git-filter-repo to remove .env files from history...")
    success, stdout, stderr = run_command(" ".join(filter_cmd))
    
    if success:
        print("✓ Successfully cleaned git history")
        
        # Force push to remote
        print("Force pushing to remote...")
        push_success, push_stdout, push_stderr = run_command("git push origin main --force")
        
        if push_success:
            print("✓ Successfully pushed cleaned history to remote")
            return True
        else:
            print("✗ Failed to push to remote:")
            print(push_stderr)
            return False
    else:
        print("✗ Failed to clean git history:")
        print(stderr)
        return False

if __name__ == "__main__":
    # Check if we're in a git repository
    if not os.path.exists(".git"):
        print("Error: Not in a git repository")
        sys.exit(1)
    
    # Check if git-filter-repo is available
    success, stdout, stderr = run_command("which git-filter-repo")
    if not success:
        print("Error: git-filter-repo not found. Please install it first.")
        print("You can install it with: pip3 install git-filter-repo")
        sys.exit(1)
    
    # Run the cleanup
    if clean_git_history():
        print("\n🎉 Git history cleaned successfully!")
        print("If you need to restore, use: git checkout backup-before-cleanup")
    else:
        print("\n❌ Failed to clean git history")
        sys.exit(1) 