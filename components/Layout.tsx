import React from "react";
import Sidebar from "./Sidebar";
import styles from "./Layout.module.css"; // создадим файл Layout.module.css

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
