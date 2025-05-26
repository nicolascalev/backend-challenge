type Backend = {
  name: string;
  baseUrl?: string;
};

export const backends: Backend[] = [
  { name: "Node js backend", baseUrl: "http://localhost:3000" },
  { name: "Golang backend", baseUrl: "http://localhost:3001" },
  { name: "C# backend", baseUrl: "" },
];