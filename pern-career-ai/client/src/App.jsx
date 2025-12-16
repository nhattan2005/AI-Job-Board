import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import CareerPath from './pages/CareerPath';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Switch>
          <Route path="/" exact component={CareerPath} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;