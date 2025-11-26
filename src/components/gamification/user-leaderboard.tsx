"use client";

import { LeaderboardPeriod, UserLeaderboardItem } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";

interface UserLeaderboardProps {
  items: UserLeaderboardItem[];
  period: LeaderboardPeriod;
  sedeName?: string;
}

const periodLabel: Record<LeaderboardPeriod, string> = {
  all: "Histórico",
  "30d": "Últimos 30 días",
  "7d": "Última semana",
};

export function UserLeaderboard({
  items,
  period,
  sedeName,
}: UserLeaderboardProps) {
  const { userId } = useAuth();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            Ranking de usuarios
          </CardTitle>
          <CardDescription>
            {periodLabel[period]}{" "}
            {sedeName ? `· Sede ${sedeName}` : "· Todas las sedes"}
          </CardDescription>
        </div>
        <Badge variant="secondary" className="text-xs">
          {items.length} usuarios
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Todavía no hay puntos registrados para este período.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border dark:border-gray-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">#</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isCurrentUser = item.userId === userId;
                  const isTop3 = item.rank <= 3;

                  return (
                    <TableRow
                      key={item.userId + item.rank}
                      className={cn(
                        isCurrentUser &&
                          "bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-l-blue-500",
                        !isCurrentUser &&
                          "hover:bg-muted/50 transition-colors"
                      )}
                    >
                      <TableCell className="text-center font-semibold">
                        <span
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center rounded-full text-xs",
                            item.rank === 1 &&
                              "bg-yellow-400/90 text-black font-bold shadow-sm",
                            item.rank === 2 &&
                              "bg-gray-300/90 text-black font-semibold",
                            item.rank === 3 &&
                              "bg-amber-600/90 text-white font-semibold",
                            item.rank > 3 &&
                              "bg-muted text-muted-foreground text-xs"
                          )}
                        >
                          {item.rank}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {isCurrentUser ? "Vos" : item.user?.fullName ?? item.userId}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[11px] text-blue-600 dark:text-blue-300">
                              Tu posición en el ranking
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-sm">
                          {item.totalPoints.toLocaleString("es-AR")}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
