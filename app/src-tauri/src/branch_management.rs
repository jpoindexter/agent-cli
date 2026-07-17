use serde::Serialize;
use std::{
    path::Path,
    process::{Command, Output},
};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct LocalBranch {
    pub(crate) current: bool,
    pub(crate) name: String,
}

#[tauri::command]
pub(crate) fn list_local_branches(root: String) -> Result<Vec<LocalBranch>, String> {
    let root = repository_root(&root)?;
    let current = git_text(
        &root,
        &["branch", "--show-current"],
        "read the current branch",
    )?;
    let names = git_text(
        &root,
        &[
            "for-each-ref",
            "--format=%(refname:short)",
            "--sort=refname",
            "refs/heads",
        ],
        "list local branches",
    )?;
    Ok(names
        .lines()
        .filter(|name| !name.is_empty())
        .map(|name| LocalBranch {
            current: name == current,
            name: name.into(),
        })
        .collect())
}

#[tauri::command]
pub(crate) fn create_git_branch(root: String, name: String) -> Result<String, String> {
    switch_branch(root, name, true)
}

#[tauri::command]
pub(crate) fn checkout_git_branch(root: String, name: String) -> Result<String, String> {
    switch_branch(root, name, false)
}

fn git(root: &str, args: &[&str]) -> Result<Output, String> {
    Command::new("git")
        .arg("-C")
        .arg(root)
        .args(args)
        .output()
        .map_err(|error| format!("Could not run git: {error}"))
}

fn git_text(root: &str, args: &[&str], label: &str) -> Result<String, String> {
    let output = git(root, args)?;
    if !output.status.success() {
        return Err(format!(
            "Could not {label}: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().into())
}

fn repository_root(root: &str) -> Result<String, String> {
    let path = Path::new(root)
        .canonicalize()
        .map_err(|error| format!("Could not open project: {error}"))?;
    if !path.is_dir() {
        return Err("Project path is not a directory".into());
    }
    let canonical = path.to_string_lossy().into_owned();
    git_text(
        &canonical,
        &["rev-parse", "--show-toplevel"],
        "open the Git repository",
    )?;
    Ok(canonical)
}

fn valid_branch_name(root: &str, name: &str) -> Result<String, String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("Enter a valid branch name".into());
    }
    let output = git(root, &["check-ref-format", "--branch", name])?;
    if !output.status.success() {
        return Err("Enter a valid branch name".into());
    }
    Ok(name.into())
}

fn ensure_clean(root: &str) -> Result<(), String> {
    if !git_text(root, &["status", "--porcelain"], "check project changes")?.is_empty() {
        return Err("Commit or stash uncommitted changes before switching branches".into());
    }
    Ok(())
}

fn switch_branch(root: String, name: String, create: bool) -> Result<String, String> {
    let root = repository_root(&root)?;
    let name = valid_branch_name(&root, &name)?;
    ensure_clean(&root)?;
    let args = if create {
        vec!["switch", "-c", name.as_str()]
    } else {
        vec!["switch", name.as_str()]
    };
    git_text(
        &root,
        &args,
        if create {
            "create the branch"
        } else {
            "switch branches"
        },
    )?;
    Ok(name)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        fs,
        path::Path,
        process::Command,
        sync::atomic::{AtomicUsize, Ordering},
        time::{SystemTime, UNIX_EPOCH},
    };

    static REPO_SEQUENCE: AtomicUsize = AtomicUsize::new(0);

    fn repo() -> String {
        let path = std::env::temp_dir().join(format!(
            "keelhouse-branches-{}-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos(),
            REPO_SEQUENCE.fetch_add(1, Ordering::Relaxed),
        ));
        fs::create_dir_all(&path).unwrap();
        let git = |args: &[&str]| {
            assert!(Command::new("git")
                .arg("-C")
                .arg(&path)
                .args(args)
                .status()
                .unwrap()
                .success())
        };
        git(&["init", "-b", "main"]);
        git(&["config", "user.email", "test@keelhouse.local"]);
        git(&["config", "user.name", "Keelhouse Test"]);
        fs::write(path.join("README.md"), "start\n").unwrap();
        git(&["add", "."]);
        git(&["commit", "-m", "start"]);
        path.to_string_lossy().into_owned()
    }

    #[test]
    fn lists_creates_and_checks_out_local_branches() {
        let root = repo();
        assert_eq!(list_local_branches(root.clone()).unwrap()[0].name, "main");
        assert_eq!(
            create_git_branch(root.clone(), "feature/api".into()).unwrap(),
            "feature/api"
        );
        assert_eq!(
            checkout_git_branch(root.clone(), "main".into()).unwrap(),
            "main"
        );
        let branches = list_local_branches(root.clone()).unwrap();
        assert!(branches.iter().any(|branch| branch.name == "feature/api"));
        assert!(branches
            .iter()
            .any(|branch| branch.name == "main" && branch.current));
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn rejects_invalid_names_and_dirty_checkout() {
        let root = repo();
        assert!(create_git_branch(root.clone(), "../bad".into())
            .unwrap_err()
            .contains("valid branch"));
        create_git_branch(root.clone(), "clean".into()).unwrap();
        fs::write(Path::new(&root).join("README.md"), "dirty\n").unwrap();
        assert!(checkout_git_branch(root.clone(), "main".into())
            .unwrap_err()
            .contains("uncommitted changes"));
        fs::remove_dir_all(root).unwrap();
    }
}
