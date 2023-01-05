import './App.css';

function App() {
  return (
    <div className="App">
      <header
        className="App-header"
        style={{backgroundColor: process.env.REACT_APP_BG_COLOR}}
      >
        <img
          className="App-logo" alt="logo"
          src={process.env.REACT_APP_LOGO_SRC}
        />
        <p>
          {process.env.REACT_APP_MAIN_TEXT}
        </p>
        <a
          className="App-link"
          href={process.env.REACT_APP_LINK_HREF}
          target="_blank"
          rel="noopener noreferrer"
        >
          {process.env.REACT_APP_LINK_TEXT}
        </a>
      </header>
    </div>
  );
}

export default App;
