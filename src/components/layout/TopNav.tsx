import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Home, Sparkles, Layers, FolderOpen, Settings, Menu as MenuIcon, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../store/themeStore';
import { Drawer } from '../ui/Drawer';
import { IconButton } from '../ui/IconButton';
import { Logo } from '../Logo';

const LINKS = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/editor', label: 'Editor', icon: Layers },
  { to: '/tools', label: 'Herramientas', icon: Sparkles },
  { to: '/projects', label: 'Proyectos', icon: FolderOpen },
  { to: '/settings', label: 'Ajustes', icon: Settings },
];

export function TopNav() {
  const mode = useTheme((s) => s.mode);
  const setMode = useTheme((s) => s.setMode);
  const [menuOpen, setMenuOpen] = useState(false);

  const nextMode = mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark';
  const ThemeIcon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor;

  return (
    <>
      <header className="topnav">
        <Link to="/" className="brand" aria-label="PixelForge inicio">
          <Logo className="brand-logo" />
          <span>
            Pixel<span className="gradient-text">Forge</span>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Principal">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <IconButton icon={ThemeIcon} label={`Tema: ${mode}`} onClick={() => setMode(nextMode)} />
          <button
            type="button"
            className="icon-btn mobile-menu-btn"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon size={20} />
          </button>
        </div>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menú" side="right">
        <nav className="col gap-1" aria-label="Principal móvil">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </Drawer>
    </>
  );
}
