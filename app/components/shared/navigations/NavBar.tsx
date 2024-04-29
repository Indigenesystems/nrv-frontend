"use client";
import { useState } from "react";
import Button from "../buttons/Button";
import NavLink from "./NavLink";
import Logo from "../../../../public/images/nrv-logo.png";
import Image from "next/image";
import { BsList, BsX } from "react-icons/bs";

const navItems = [
  { text: "Home", route: "/" },
  { text: "Feature", route: "/about" },
  { text: "How it works", route: "/services" },
  { text: "FAQs", route: "/contact" },
];

// Create a component to render the navigation items
const Navigation = () => (
  <nav className="flex flex-col md:flex-row md:justify-center gap-4 md:gap-10">
    {navItems.map(({ text, route }, index) => (
      <div key={index}>
        <div>
          <NavLink href={route}>{text}</NavLink>
        </div>
      </div>
    ))}
  </nav>
);

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="w-full py-4 pr-6 md:px-12 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Image src={Logo} width={200} height={50} alt="logo" className="object-none" />
      </div>
      <div className="hidden md:flex md:items-center">
        <Navigation />
      </div>
      <div className="flex items-center space-x-4">
        <button
          className="md:hidden text-gray-600 focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <BsX size={24} /> : <BsList size={24} />}
        </button>
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
          <Navigation />
          <div className="md:flex gap-4 justify-end">
          <div className="pt-3 mb-4">
          <NavLink href="/sign-in">Sign In</NavLink>
          </div>
          <Button size="large" variant="primary" showIcon={false}>Get Started</Button>
        </div>
        </div>
        <div className="hidden md:flex gap-4 justify-end">
          <div className="pt-3">
          <NavLink href="/sign-in">Sign In</NavLink>
          </div>
          <Button size="large" variant="primary" showIcon={false}>Get Started</Button>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
