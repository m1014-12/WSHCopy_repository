const React = require('react');

module.exports = {
  useNavigate: () => jest.fn(),
  Link: ({ children, ...props }) => React.createElement('a', props, children),
  NavLink: ({ children, ...props }) => React.createElement('a', props, children),
  MemoryRouter: ({ children }) => React.createElement('div', null, children),
};
// Mock for react-router-dom
import React from 'react';

export const useNavigate = () => jest.fn();
export const useParams = () => ({ id: '123', token: 'abc123' });
export const useLocation = () => ({ pathname: '/test' });

export const Link = ({ children, to, ...props }) => (
  <a href={to} {...props}>
    {children}
  </a>
);

export const BrowserRouter = ({ children }) => <div>{children}</div>;
export const Router = ({ children }) => <div>{children}</div>;
export const Routes = ({ children }) => <div>{children}</div>;
export const Route = ({ children }) => <div>{children}</div>;

export default {
  useNavigate,
  useParams,
  useLocation,
  Link,
  BrowserRouter,
  Router,
  Routes,
  Route,
};
