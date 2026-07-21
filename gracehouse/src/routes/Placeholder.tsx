export default function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-3xl">{title}</h1>
      <p className="text-muted mt-2">{note}</p>
    </div>
  );
}
