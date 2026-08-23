import type { Metadata } from "next";
import RoadmapApp from "./roadmap-app";

export const metadata: Metadata = {
  title: "CalcPath — AP Calculus Roadmap",
  description: "A focused, offline-ready roadmap for AP Calculus AB and BC.",
};

export default function Home() {
  return <RoadmapApp />;
}
