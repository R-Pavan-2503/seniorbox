import { Search } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Header = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const submit = () => {
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
        <Link to="/" className="text-xl font-semibold tracking-wide text-emerald-400">OmniLog</Link>
        <nav className="flex flex-wrap gap-3 text-sm text-zinc-300">
          <NavLink to="/popular/movie" className="hover:text-white">Movies</NavLink>
          <NavLink to="/popular/tv" className="hover:text-white">Shows</NavLink>
          <NavLink to="/popular/book" className="hover:text-white">Books</NavLink>
          <NavLink to="/activity" className="hover:text-white">Activity</NavLink>
          {user && <NavLink to="/feed" className="hover:text-white">Feed</NavLink>}
          {user && <NavLink to="/library" className="hover:text-white">Library</NavLink>}
          {user && <NavLink to="/lists" className="hover:text-white">Lists</NavLink>}
        </nav>
        <div className="flex flex-1 gap-2 md:justify-end">
          <div className="flex w-full max-w-md items-center rounded-md border bg-zinc-900 px-2">
            <Search className="h-4 w-4 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
              placeholder="Search movies, shows, books"
              className="w-full bg-transparent px-2 py-2 text-sm"
            />
          </div>
          {user ? (
            <button type="button" onClick={() => signOut()} className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-900">Sign out</button>
          ) : (
            <Link to="/login" className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
};
