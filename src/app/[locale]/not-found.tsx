"use client";

import GridShape from "@/components/common/GridShape";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  ArrowLeftIcon
} from "../../icons/index";
import Button from "@/components/ui/button/Button";
export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      <GridShape />
      <div className="mx-auto w-full max-w-60.5 text-center sm:max-w-118">
        <h1 className="mb-8 text-title-md font-bold text-gray-800 xl:text-title-2xl dark:text-white/90">
          {t("error")}
        </h1>
        <Image
          src="/images/error/404.svg"
          alt="404"
          className="dark:hidden"
          width={472}
          height={152}
        />
        <Image
          src="/images/error/404-dark.svg"
          alt="404"
          className="hidden dark:block"
          width={472}
          height={152}
        />

        <p className="  mt-10 mb-6 text-base text-gray-700 sm:text-lg dark:text-gray-400">

          {t("message")}
        </p>

        <Link
          href="/"
          // className=" flex items-center justify-center px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-transparent border border-gray-300 rounded-lg transition-all duration-300 ease-in-out hover:border-cyan-400 hover:text-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95"
        >
          <Button
            size="sm"
            variant="outline"
            startIcon={<ArrowLeftIcon style={{ height: '16px', width: '16px' }} />}
            className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-transparent border border-gray-300 rounded-lg transition-all duration-300 ease-in-out hover:border-cyan-400 hover:text-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95 "
          >
            {t("backHome")} 
          </Button>
          {/* <span className="mr-2"><ArrowLeftIcon style={{ height: '16px', width: '16px' }} /></span>
          {t("backHome")} */}
        </Link>

      </div>
      {/* <!-- Footer --> */}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} - TailAdmin
      </p>
    </div>
  );
}
