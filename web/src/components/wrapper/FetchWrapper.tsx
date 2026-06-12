import { fetchProspects } from "@/sanity/fetch";
import PipelineClient from "./PipelineClient";

export default async function FetchWrapper() {
    const data = await fetchProspects();

    return <PipelineClient data={data} />;
}