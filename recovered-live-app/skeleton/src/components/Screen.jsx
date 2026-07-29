import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROUTES } from '../routes';

/**
 * Generic reconstructed screen. Each of the 49 routes renders through this stub,
 * which documents the screen's group and the exact backend tables/RPCs the live
 * app used for it (from analysis/data-model.md). Replace per-screen with real UI.
 */
export default function Screen() {
  const { screen } = useParams();
  const meta = ROUTES.find((r) => r.path === screen);
  if (!meta) return <NotFound path={screen} />;

  return (
    <motion.div
      key={meta.path}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="screen"
    >
      <span className="chip">{meta.group}</span>
      <h1>{meta.title}</h1>
      <p className="muted">
        Reconstructed skeleton screen. The original UI was not recoverable (no source
        maps); this stub records the route and its intended data wiring.
      </p>

      {meta.tables?.length > 0 && (
        <section>
          <h2>Backend tables (as called by the live app)</h2>
          <ul>{meta.tables.map((t) => <li key={t}><code>{t}</code></li>)}</ul>
        </section>
      )}
      {meta.rpc?.length > 0 && (
        <section>
          <h2>RPCs</h2>
          <ul>{meta.rpc.map((r) => <li key={r}><code>{r}()</code></li>)}</ul>
        </section>
      )}
      {meta.note && <p className="note">{meta.note}</p>}
    </motion.div>
  );
}

function NotFound({ path }) {
  return (
    <div className="screen">
      <h1>Unknown screen</h1>
      <p className="muted">No route named <code>{String(path)}</code>.</p>
    </div>
  );
}
