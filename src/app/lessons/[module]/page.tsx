import Client from "./lessons-client";

/** Module slugs are a closed set, so the shell is prerendered and the data loads on the client. */
export function generateStaticParams() {
  return [
    "vocabulary",
    "reading",
    "listening",
    "business-english",
    "contracts",
    "grammar",
  ].map((slug) => ({ module: slug }));
}

export default function Page() {
  return <Client />;
}
