import type { Metadata } from 'next'; import './globals.css';
export const metadata:Metadata={title:'NattaVault — Things I’ve made.',description:'A personal digital archive.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
