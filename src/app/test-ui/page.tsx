"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { VistralLogo } from "@/components/vistral-logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TestUIPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Test UI Components</h1>
            <p className="text-muted-foreground">
              Página de prueba para verificar el sistema de diseño PropHero
            </p>
          </div>
          <div className="flex items-center gap-4">
            <VistralLogo />
            <ThemeToggle />
          </div>
        </div>

        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Component</CardTitle>
            <CardDescription>Variantes del logo Vistral</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-8 items-center">
            <div className="space-y-2">
              <Label>Default (Theme-aware)</Label>
              <VistralLogo />
            </div>
            <div className="space-y-2">
              <Label>Light variant</Label>
              <VistralLogo variant="light" />
            </div>
            <div className="space-y-2">
              <Label>Dark variant</Label>
              <VistralLogo variant="dark" />
            </div>
            <div className="space-y-2">
              <Label>Icon only</Label>
              <VistralLogo iconOnly />
            </div>
          </CardContent>
        </Card>

        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Diferentes variantes y tamaños de botones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Variants</Label>
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sizes</Label>
              <div className="flex flex-wrap gap-2 items-center">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">🚀</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Inputs, labels, checkboxes y textareas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje</Label>
              <Textarea id="message" placeholder="Escribe tu mensaje aquí..." />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms" className="cursor-pointer">
                Acepto los términos y condiciones
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Select</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Opción 1</SelectItem>
                  <SelectItem value="option2">Opción 2</SelectItem>
                  <SelectItem value="option3">Opción 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cards Section */}
        <Card>
          <CardHeader>
            <CardTitle>Card Component</CardTitle>
            <CardDescription>Ejemplo de uso del componente Card</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Este es el contenido de la tarjeta. Puedes usar CardHeader, CardTitle,
              CardDescription, CardContent y CardFooter para estructurar el contenido.
            </p>
          </CardContent>
          <CardFooter>
            <Button>Acción</Button>
          </CardFooter>
        </Card>

        {/* Tabs Section */}
        <Card>
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
            <CardDescription>Componente de pestañas</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tab1">
              <TabsList>
                <TabsTrigger value="tab1">Pestaña 1</TabsTrigger>
                <TabsTrigger value="tab2">Pestaña 2</TabsTrigger>
                <TabsTrigger value="tab3">Pestaña 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="mt-4">
                <p>Contenido de la pestaña 1</p>
              </TabsContent>
              <TabsContent value="tab2" className="mt-4">
                <p>Contenido de la pestaña 2</p>
              </TabsContent>
              <TabsContent value="tab3" className="mt-4">
                <p>Contenido de la pestaña 3</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* PropHero Colors */}
        <Card>
          <CardHeader>
            <CardTitle>PropHero Design Tokens</CardTitle>
            <CardDescription>Colores del sistema de diseño PropHero</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-[var(--prophero-blue-500)]"></div>
                <p className="text-xs text-muted-foreground">Blue 500</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-[var(--prophero-blue-600)]"></div>
                <p className="text-xs text-muted-foreground">Blue 600</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-[var(--prophero-success)]"></div>
                <p className="text-xs text-muted-foreground">Success</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-[var(--prophero-warning)]"></div>
                <p className="text-xs text-muted-foreground">Warning</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-[var(--prophero-danger)]"></div>
                <p className="text-xs text-muted-foreground">Danger</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
