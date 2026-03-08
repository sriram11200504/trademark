import Spreadsheet from "@/components/Spreadsheet";

export default async function DocumentPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <main>
            <Spreadsheet docId={id} />
        </main>
    );
}
