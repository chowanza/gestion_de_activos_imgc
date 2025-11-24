import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cake, CalendarDays, PartyPopper } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  fechaNacimiento?: string | null;
  fotoPerfil?: string | null;
  // Add other fields if necessary
}

interface BirthdayModalProps {
  empleados: Empleado[];
}

interface BirthdayInfo {
  empleado: Empleado;
  date: Date;
  daysRemaining: number;
  age: number;
  isToday: boolean;
  hasPassedThisYear: boolean;
}

export function BirthdayModal({ empleados }: BirthdayModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const birthdayData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    const data: BirthdayInfo[] = empleados
      .filter(e => e.fechaNacimiento)
      .map(e => {
        // Try to parse the date. Assuming ISO string or YYYY-MM-DD. 
        // If it's DD/MM/YYYY we might need custom parsing.
        let birthDate = new Date(e.fechaNacimiento!);
        
        // Check if valid date
        if (isNaN(birthDate.getTime())) {
            // Try parsing DD/MM/YYYY if ISO fails
            const parts = e.fechaNacimiento!.split('/');
            if (parts.length === 3) {
                birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
        }

        if (isNaN(birthDate.getTime())) return null;

        // FIX: Add 1 day to the date because the database/frontend mismatch
        // causes dates to appear one day behind.
        birthDate.setDate(birthDate.getDate() + 1);

        // Adjust for timezone if necessary, but usually birthdates are just dates.
        // We'll treat them as local dates at 00:00:00
        const birthMonth = birthDate.getMonth();
        const birthDay = birthDate.getDate();

        let nextBirthday = new Date(currentYear, birthMonth, birthDay);
        
        // Check if birthday has passed this year
        let hasPassedThisYear = false;
        if (nextBirthday < today) {
          hasPassedThisYear = true;
          // Next birthday is next year for calculation purposes if we want "upcoming"
          // But the requirement says "who already had it and who is missing"
        }

        // Calculate age
        let age = currentYear - birthDate.getFullYear();
        if (!hasPassedThisYear && nextBirthday > today) {
            age--; 
        }
        if (hasPassedThisYear) {
             // If passed, they already turned the age
        } else if (nextBirthday.getTime() === today.getTime()) {
            // Today is birthday
        }

        // Days remaining
        // If passed, days remaining until next year's birthday
        let targetDate = new Date(currentYear, birthMonth, birthDay);
        if (hasPassedThisYear) {
            targetDate = new Date(currentYear + 1, birthMonth, birthDay);
        }
        
        const diffTime = targetDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isToday = daysRemaining === 0;

        return {
          empleado: e,
          date: birthDate,
          daysRemaining,
          age: isToday || hasPassedThisYear ? age : age + 1, // Age they are turning or turned
          isToday,
          hasPassedThisYear
        };
      })
      .filter((item): item is BirthdayInfo => item !== null)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    return data;
  }, [empleados]);

  const todaysBirthdays = birthdayData.filter(b => b.isToday);
  const upcomingBirthdays = birthdayData.filter(b => !b.isToday && !b.hasPassedThisYear);
  const pastBirthdays = birthdayData.filter(b => b.hasPassedThisYear).sort((a, b) => {
      // Sort past birthdays by who celebrated most recently (descending date in current year)
      // or by who celebrated first in the year? 
      // Usually "Past" list implies chronological order from Jan 1st to yesterday.
      const dateA = new Date(new Date().getFullYear(), a.date.getMonth(), a.date.getDate());
      const dateB = new Date(new Date().getFullYear(), b.date.getMonth(), b.date.getDate());
      return dateB.getTime() - dateA.getTime(); // Most recent past first
  });

  // Group by month for the "By Month" view
  const byMonth = useMemo(() => {
      const months: { [key: number]: BirthdayInfo[] } = {};
      birthdayData.forEach(b => {
          const month = b.date.getMonth();
          if (!months[month]) months[month] = [];
          months[month].push(b);
      });
      return months;
  }, [birthdayData]);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const currentMonth = new Date().getMonth();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 hover:bg-pink-100 hover:border-pink-300 text-pink-700">
          <Cake className="h-4 w-4 text-pink-500" />
          <span className="hidden sm:inline">Cumpleaños</span>
          {todaysBirthdays.length > 0 && (
            <Badge variant="secondary" className="bg-pink-500 text-white hover:bg-pink-600 ml-1">
              {todaysBirthdays.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 bg-white/95 backdrop-blur-xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <PartyPopper className="h-6 w-6 text-pink-500" />
            Calendario de Cumpleaños
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden p-6 pt-2 flex flex-col">
          <Tabs defaultValue="upcoming" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4 shrink-0">
              <TabsTrigger value="upcoming">Próximos</TabsTrigger>
              <TabsTrigger value="month">Por Mes</TabsTrigger>
              <TabsTrigger value="past">Pasados</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto min-h-0 pr-2">
              <TabsContent value="upcoming" className="mt-0 space-y-6 pb-6">
                {todaysBirthdays.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-pink-600 flex items-center gap-2">
                      <Cake className="h-5 w-5" />
                      ¡Hoy es su día!
                    </h3>
                    <div className="grid gap-3">
                      {todaysBirthdays.map((b) => (
                        <Card key={b.empleado.id} className="border-pink-200 bg-pink-50/50 overflow-hidden relative">
                          <div className="absolute top-0 left-0 w-1 h-full bg-pink-500" />
                          <CardContent className="p-4 flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-pink-200">
                              <AvatarImage src={b.empleado.fotoPerfil || undefined} />
                              <AvatarFallback>{b.empleado.nombre[0]}{b.empleado.apellido[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-900">
                                {b.empleado.nombre} {b.empleado.apellido}
                              </h4>
                              <p className="text-pink-600 font-medium">
                                ¡Feliz Cumpleaños #{b.age}! 🎉
                              </p>
                            </div>
                            <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm border border-pink-100">
                              <span className="text-2xl">🎂</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-600 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Próximamente
                  </h3>
                  {upcomingBirthdays.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No hay más cumpleaños este año.</p>
                  ) : (
                    <div className="grid gap-3">
                      {upcomingBirthdays.map((b) => (
                        <Card key={b.empleado.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-3 flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={b.empleado.fotoPerfil || undefined} />
                              <AvatarFallback>{b.empleado.nombre[0]}{b.empleado.apellido[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {b.empleado.nombre} {b.empleado.apellido}
                              </p>
                              <p className="text-sm text-gray-500">
                                {b.date.getDate()} de {monthNames[b.date.getMonth()]}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Faltan {b.daysRemaining} días
                              </Badge>
                              <p className="text-xs text-gray-400 mt-1">Cumplirá {b.age}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="month" className="mt-0 pb-6">
                <div className="space-y-6">
                  {monthNames.map((monthName, index) => {
                    const birthdaysInMonth = byMonth[index] || [];
                    if (birthdaysInMonth.length === 0) return null;
                    
                    // Sort by day
                    birthdaysInMonth.sort((a, b) => a.date.getDate() - b.date.getDate());

                    const isCurrentMonth = index === currentMonth;

                    return (
                      <div key={monthName} className="space-y-2">
                        <div className={`sticky top-0 z-10 py-2 px-1 backdrop-blur-sm ${isCurrentMonth ? 'text-blue-600 font-bold' : 'text-gray-500 font-medium'}`}>
                          {monthName} {isCurrentMonth && "(Mes Actual)"}
                        </div>
                        <div className="grid gap-2">
                          {birthdaysInMonth.map((b) => (
                            <div key={b.empleado.id} className={`flex items-center gap-3 p-2 rounded-lg ${b.isToday ? 'bg-pink-50 border border-pink-100' : 'bg-gray-50/50'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${b.isToday ? 'bg-pink-100 text-pink-700' : 'bg-gray-200 text-gray-600'}`}>
                                {b.date.getDate()}
                              </div>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={b.empleado.fotoPerfil || undefined} />
                                <AvatarFallback className="text-xs">{b.empleado.nombre[0]}{b.empleado.apellido[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 truncate text-sm">
                                <span className="font-medium block">{b.empleado.nombre} {b.empleado.apellido}</span>
                                <span className="text-xs text-gray-500">{b.date.getDate()} de {monthNames[b.date.getMonth()]}</span>
                              </div>
                              {b.isToday && <Badge className="bg-pink-500 text-[10px] h-5">Hoy</Badge>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="past" className="mt-0 pb-6">
                <div className="space-y-3">
                    <h3 className="font-semibold text-gray-600">Ya celebraron este año</h3>
                    <div className="grid gap-2">
                      {pastBirthdays.map((b) => (
                        <div key={b.empleado.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/30 opacity-75 hover:opacity-100 transition-opacity">
                           <Avatar className="h-10 w-10 grayscale-[0.5]">
                              <AvatarImage src={b.empleado.fotoPerfil || undefined} />
                              <AvatarFallback>{b.empleado.nombre[0]}{b.empleado.apellido[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-medium text-gray-700">{b.empleado.nombre} {b.empleado.apellido}</p>
                                <p className="text-xs text-gray-500">Celebró el {b.date.getDate()} de {monthNames[b.date.getMonth()]}</p>
                            </div>
                            <Badge variant="secondary" className="text-gray-500">
                                {b.age} años
                            </Badge>
                        </div>
                      ))}
                      {pastBirthdays.length === 0 && (
                          <p className="text-center text-gray-500 py-4">Nadie ha cumplido años aún este año.</p>
                      )}
                    </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
