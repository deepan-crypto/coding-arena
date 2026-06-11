import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="ghost-button" onClick={toggleTheme} type="button">
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}