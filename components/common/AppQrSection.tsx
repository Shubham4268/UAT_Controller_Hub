'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Smartphone, Apple } from 'lucide-react';

interface AppQrSectionProps {
    androidAppLink?: string;
    iosAppLink?: string;
    androidQr?: string;
    iosQr?: string;
}

export function AppQrSection({ androidAppLink, iosAppLink, androidQr, iosQr }: AppQrSectionProps) {
    if (!androidAppLink && !iosAppLink) return null;

    return (
        <Card className="overflow-hidden border-2 border-primary/10">
            <CardHeader className="bg-primary/5 py-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    📱 App Download QR Codes
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex flex-wrap gap-8 justify-center sm:justify-start">
                    {androidAppLink && (
                        <div className="flex flex-col items-center gap-3">
                            <Badge variant="outline" className="gap-1.5 py-1 px-3 bg-green-50 text-green-700 border-green-200">
                                <Smartphone className="h-3.5 w-3.5" />
                                Android App
                            </Badge>
                            {androidQr && (
                                <div className="bg-white p-2 border-2 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <img
                                        src={androidQr}
                                        alt="Android QR Code"
                                        className="w-32 h-32"
                                    />
                                </div>
                            )}
                            <a
                                href={androidAppLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-500 hover:underline max-w-[140px] truncate"
                            >
                                {androidAppLink}
                            </a>
                        </div>
                    )}

                    {iosAppLink && (
                        <div className="flex flex-col items-center gap-3">
                            <Badge variant="outline" className="gap-1.5 py-1 px-3 bg-blue-50 text-blue-700 border-blue-200">
                                <Apple className="h-3.5 w-3.5" />
                                iOS App
                            </Badge>
                            {iosQr && (
                                <div className="bg-white p-2 border-2 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <img
                                        src={iosQr}
                                        alt="iOS QR Code"
                                        className="w-32 h-32"
                                    />
                                </div>
                            )}
                            <a
                                href={iosAppLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-500 hover:underline max-w-[140px] truncate"
                            >
                                {iosAppLink}
                            </a>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
