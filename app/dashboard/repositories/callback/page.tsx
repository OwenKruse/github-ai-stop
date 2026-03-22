import { redirect } from "next/navigation"

export default async function GitHubInstallationCallback() {
  redirect("/dashboard/repositories")
}
