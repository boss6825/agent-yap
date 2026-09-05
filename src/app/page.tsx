import { getShelfData } from "@/lib/shelf";
import { Home } from "@/components/Home";

export default function Page() {
  return <Home shelf={getShelfData()} />;
}
