import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export function EmptyDecks() {
    return (<div className="flex flex-col items-center justify-center gap-3 h-full text-center">
        <h2 className="text-xl font-semibold">No decks created yet</h2>
        <p className="text-muted-foreground">Go create your first deck !</p>
        <Button asChild><Link to="/decks/new">Create your first deck</Link></Button>
    </div>)
}