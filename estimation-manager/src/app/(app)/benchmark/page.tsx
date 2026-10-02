import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function BenchmarkPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Benchmark</h1>
        <p className="text-gray-500 text-sm mt-1">
          Vergleich von Schätzungen mit tatsächlichen Projektergebnissen.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 className="h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-lg font-medium text-gray-600">In Vorbereitung</h2>
          <p className="text-gray-400 text-sm mt-2 max-w-sm">
            Die Benchmark-Funktion zum Abgleich von Schätzungen mit Ist-Daten wird in einer späteren Version verfügbar sein.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
