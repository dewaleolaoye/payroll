export type Theme = "light" | "dark";
export const themeKey = "nlng-theme";
// Runs in <head> before first paint so the saved (or system) theme applies without a flash.
export const themeScript = `(function(){try{var t=localStorage.getItem("${themeKey}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
