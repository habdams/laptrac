import { useLoaderData } from "react-router";

// Your data fetching stays isolated here
export async function clientLoader() {
  const res = await fetch("api/dashboard-stats")
  return res.json();
}

// Your UI stays isolated here
export function Component() {
  const data = useLoaderData();
  return (
    <div>
      <h1>Dashboard</h1>
      <pre>{ JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
