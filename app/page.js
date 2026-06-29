import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Login from "./LoginClient";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;

  if (token) {
    redirect("/dashboard/insight");
  }

  return <Login />;
}
