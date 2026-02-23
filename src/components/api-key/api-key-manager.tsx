"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ApiKey } from "@/types";
import apiKeyService from "@/services/api-key.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  IconKey,
  IconCopy,
  IconRefresh,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const ApiKeyManager = () => {
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const key = await apiKeyService.getApiKey();
        setApiKey(key);
      } catch (error: any) {
        console.error("Error al obtener la API key:", error);

        if (error?.status === 404) {
          setApiKey(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  const handleGenerateKey = async () => {
    setProcessing(true);
    try {
      const newKey = await apiKeyService.generateApiKey();
      setApiKey(newKey);
      toast.success("API key generada exitosamente");
    } catch (error: any) {
      if (error?.status === 409) {
        toast.error("Ya tienes una API key generada");
      } else {
        toast.error("Error al generar la API key");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!apiKey) return;

    setProcessing(true);
    try {
      const newKey = await apiKeyService.regenerateApiKey(apiKey.id);
      setApiKey(newKey);
      toast.success("API key regenerada exitosamente");
      setShowKey(true);
    } catch (error: any) {
      if (error?.status === 404) {
        toast.error("API key no encontrada");
      } else if (error?.status === 403) {
        toast.error("No tienes permiso para regenerar esta API key");
      } else {
        toast.error("Error al regenerar la API key");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!apiKey) return;

    setProcessing(true);
    try {
      const updatedKey = await apiKeyService.toggleApiKeyStatus(
        apiKey.id,
        !apiKey.isActive
      );
      setApiKey(updatedKey);
      toast.success(
        `API key ${
          updatedKey.isActive ? "habilitada" : "deshabilitada"
        } exitosamente`
      );
    } catch (error: any) {
      if (error?.status === 404) {
        toast.error("API key no encontrada");
      } else if (error?.status === 403) {
        toast.error("No tienes permiso para modificar esta API key");
      } else {
        toast.error("Error al actualizar el estado de la API key");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyKey = async () => {
    if (!apiKey?.key) return;

    try {
      await navigator.clipboard.writeText(apiKey.key);
      toast.success("API key copiada al portapapeles");
    } catch (error) {
      toast.error("Error al copiar la API key");
    }
  };

  const maskApiKey = (key: string): string => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}${"*".repeat(key.length - 8)}${key.substring(
      key.length - 4
    )}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gestión de API Key</h1>
        <p className="text-muted-foreground">
          Administra tu API key de Medibook para integración con sistemas
          externos
        </p>
      </div>

      {!apiKey ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconKey className="w-6 h-6" />
              <CardTitle>Generar API Key</CardTitle>
            </div>
            <CardDescription>
              Aún no tienes una API key. Genera una para comenzar a integrar con
              la API de Medibook.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-semibold mb-2">Notas Importantes:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>
                    Tu API key se mostrará solo una vez después de generarse
                  </li>
                  <li>Guárdala de forma segura - no podrás verla nuevamente</li>
                  <li>
                    Puedes regenerarla en cualquier momento si es necesario
                  </li>
                  <li>La key será enviada al backend para su validación</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerateKey}
              disabled={processing}
              className="w-full"
            >
              {processing ? "Generando..." : "Generar API Key"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconKey className="w-6 h-6" />
                <CardTitle>Tu API Key</CardTitle>
              </div>
              <Badge variant={apiKey.isActive ? "default" : "destructive"}>
                {apiKey.isActive ? "Activa" : "Deshabilitada"}
              </Badge>
            </div>
            <CardDescription>
              Usa esta key para autenticar tus peticiones a la API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  value={
                    showKey
                      ? apiKey.key ?? ""
                      : maskApiKey(apiKey.key ?? apiKey.keyLastFour ?? "••••••••")
                  }
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? "Ocultar key" : "Mostrar key"}
                >
                  {showKey ? (
                    <IconEyeOff className="w-4 h-4" />
                  ) : (
                    <IconEye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyKey}
                  title="Copiar al portapapeles"
                >
                  <IconCopy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Creada el</Label>
                <p className="font-medium">
                  {new Date(apiKey.createdAt).toLocaleString("es-ES")}
                </p>
              </div>
              {apiKey.lastUsed && (
                <div>
                  <Label className="text-muted-foreground">Último uso</Label>
                  <p className="font-medium">
                    {new Date(apiKey.lastUsed).toLocaleString("es-ES")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleToggleStatus}
              disabled={processing}
            >
              {apiKey.isActive ? "Deshabilitar Key" : "Habilitar Key"}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={processing}>
                  <IconRefresh className="w-4 h-4 mr-2" />
                  Regenerar Key
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Regenerar API Key?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto invalidará tu API key actual y generará una nueva.
                    Cualquier aplicación que use la key anterior dejará de
                    funcionar. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRegenerateKey}>
                    Regenerar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Guía de Integración</CardTitle>
          <CardDescription>
            Cómo usar tu API key con la API de Medibook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="java">Java</TabsTrigger>
            </TabsList>

            <TabsContent value="curl" className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ejemplo de petición usando cURL en la terminal:
              </p>
              <div className="rounded-md overflow-hidden">
                <SyntaxHighlighter
                  language="bash"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                  }}
                >
                  {`curl -X GET https://api.gymcloud.com/v1/data \\
  -H "Authorization: Bearer ${
    apiKey?.key && showKey ? apiKey.key : "TU_API_KEY"
  }"`}
                </SyntaxHighlighter>
              </div>
            </TabsContent>

            <TabsContent value="javascript" className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ejemplo usando JavaScript con Fetch API:
              </p>
              <div className="rounded-md overflow-hidden">
                <SyntaxHighlighter
                  language="javascript"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                  }}
                >
                  {`fetch('https://api.gymcloud.com/v1/data', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ${
      apiKey?.key && showKey ? apiKey.key : "TU_API_KEY"
    }',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`}
                </SyntaxHighlighter>
              </div>
            </TabsContent>

            <TabsContent value="java" className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ejemplo usando Java con HttpClient (Java 11+):
              </p>
              <div className="rounded-md overflow-hidden">
                <SyntaxHighlighter
                  language="java"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                  }}
                >
                  {`import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String apiKey = "${
                    apiKey?.key && showKey
                      ? apiKey.key
                      : "TU_API_KEY"
                  }";
String url = "https://api.gymcloud.com/v1/data";

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(url))
    .header("Authorization", "Bearer " + apiKey)
    .header("Content-Type", "application/json")
    .GET()
    .build();

HttpResponse<String> response = client.send(
    request, 
    HttpResponse.BodyHandlers.ofString()
);

System.out.println(response.body());`}
                </SyntaxHighlighter>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
