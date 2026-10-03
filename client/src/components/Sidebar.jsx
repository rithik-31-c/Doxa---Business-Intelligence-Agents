function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">D</div>

        <div>
          <h2>DOXA</h2>
          <span>Business Intelligence</span>
        </div>
      </div>

      <nav className="navigation">
        <a className="active" href="#">
          <span>⌂</span>
          Dashboard
        </a>

        <a href="#">
          <span>⌕</span>
          Investigate
        </a>

        <a href="#">
          <span>◫</span>
          Sales
        </a>

        <a href="#">
          <span>▣</span>
          Inventory
        </a>

        <a href="#">
          <span>⌁</span>
          Trends
        </a>
      </nav>

      <div className="sidebar-bottom">
        <a href="#">
          <span>⚙</span>
          Settings
        </a>
      </div>
    </aside>
  );
}

export default Sidebar;