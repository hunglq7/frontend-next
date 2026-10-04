import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <div className="relative z-1 bg-white p-6 sm:p-0 dark:bg-gray-900">
    //   <ThemeProvider>
    //     <div className="relative flex h-screen w-full flex-col justify-center sm:p-0 lg:flex-row dark:bg-gray-900">
    //       {children}
    //       <div className="hidden h-full w-full items-center bg-brand-950 lg:grid lg:w-2/3 dark:bg-white/5">
    //         <div className="relative z-1 flex items-center justify-center">
    //           {/* <!-- ===== Common Grid Shape Start ===== --> */}
    //           <GridShape />
    //           <div className="flex max-w-xs flex-col items-center">
    //             <Link href="/" className="mb-4 block">
    //               <Image
    //                 width={231}
    //                 height={48}
    //                 src="./images/logo/auth-logo.svg"
    //                 alt="Logo"
    //               />
    //             </Link>
    //             <p className="text-center text-gray-400 dark:text-white/60">
    //               PHẦN MÊM QUẢN LÝ THIẾT BỊ
    //             </p>
    //           </div>
    //         </div>
    //       </div>
    //       <div className="fixed right-6 bottom-6 z-50 hidden sm:block">
    //         <ThemeTogglerTwo />
    //       </div>
    //     </div>
    //   </ThemeProvider>
    // </div>
    <div className="relative z-1 bg-white p-6 sm:p-0 dark:bg-gray-900">
      <ThemeProvider>
        <div className="relative flex h-screen w-full flex-col justify-center sm:p-0 lg:flex-row dark:bg-gray-900">
          {children}
          <div
            className="hidden h-full w-full items-center bg-cover bg-center lg:grid lg:w-2/3 dark:bg-white/5"
            style={{
              backgroundImage: "url('/images/grid-image/image-04.png')",
            }}
          >
            <div className="relative z-1 flex items-center justify-center">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
              <div className="flex max-w-xs flex-col items-center">
                <Link href="/" className="mb-4 block">
                  <Image
                    width={231}
                    height={120}
                    src="./images/logo/logo-tmd.svg"
                    alt="Logo"
                  />
                </Link>
                <p className="bg-linear-to-r from-cyan-500 via-blue-500 to-pink-500 bg-clip-text text-center text-xl text-transparent dark:text-white/60">
                  PHẦN MỀM QUẢN LÝ THIẾT BỊ
                </p>
              </div>
            </div>
          </div>
          <div className="fixed right-6 bottom-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
