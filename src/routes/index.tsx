import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main>
      <h1>Hello world</h1>
    </main>
  );
}
