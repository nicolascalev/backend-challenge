type Backend = {
  name: string;
  baseUrl?: string;
};

export const backends: Backend[] = [
  { name: "Typescript Hono backend", baseUrl: "http://localhost:5001" },
  { name: "Golang backend", baseUrl: "" },
  { name: "C# backend", baseUrl: "" },
];