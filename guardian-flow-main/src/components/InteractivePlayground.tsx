import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Star, Flame, Zap, RotateCcw } from "lucide-react";

const InteractivePlayground = () => {
  const [borderRadius, setBorderRadius] = useState([24]);
  const [scale, setScale] = useState([1]);
  const [glowEnabled, setGlowEnabled] = useState(true);
  const [likes, setLikes] = useState(42);
  const [liked, setLiked] = useState(false);
  const [activeColor, setActiveColor] = useState<string>("violet");
  const [progress, setProgress] = useState(65);

  const colors = [
    { name: "violet", class: "bg-violet" },
    { name: "teal", class: "bg-teal" },
    { name: "coral", class: "bg-coral" },
    { name: "amber", class: "bg-amber" },
    { name: "rose", class: "bg-rose" },
    { name: "sky", class: "bg-sky" },
  ];

  const colorMap: Record<string, string> = {
    violet: "shadow-glow-primary gradient-vibrant",
    teal: "shadow-glow-teal gradient-ocean",
    coral: "shadow-glow-accent gradient-sunset",
    amber: "shadow-glow-accent gradient-sunset",
    rose: "shadow-glow-accent gradient-vibrant",
    sky: "shadow-glow-teal gradient-ocean",
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  const handleReset = () => {
    setBorderRadius([24]);
    setScale([1]);
    setGlowEnabled(true);
    setActiveColor("violet");
    setProgress(65);
  };

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            Interactive <span className="gradient-text">Playground</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Tweak, toggle, and play with live components. Everything responds in real-time.
          </p>
        </motion.div>

        <Tabs defaultValue="controls" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-10">
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
          </TabsList>

          {/* Controls Tab */}
          <TabsContent value="controls">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Preview */}
              <motion.div className="flex items-center justify-center min-h-[300px]">
                <motion.div
                  animate={{ scale: scale[0] }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`w-48 h-48 ${colorMap[activeColor]?.split(" ")[1] || "gradient-vibrant"} flex items-center justify-center transition-all duration-300`}
                  style={{
                    borderRadius: `${borderRadius[0]}px`,
                    boxShadow: glowEnabled ? undefined : "none",
                  }}
                >
                  <Zap className="w-16 h-16 text-primary-foreground" />
                </motion.div>
              </motion.div>

              {/* Controls */}
              <div className="space-y-8 bg-card rounded-2xl p-8 shadow-soft">
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-3 block">
                    Border Radius: {borderRadius[0]}px
                  </label>
                  <Slider
                    value={borderRadius}
                    onValueChange={setBorderRadius}
                    max={96}
                    min={0}
                    step={1}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-card-foreground mb-3 block">
                    Scale: {scale[0].toFixed(2)}x
                  </label>
                  <Slider
                    value={scale}
                    onValueChange={setScale}
                    max={1.5}
                    min={0.5}
                    step={0.01}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-card-foreground">Glow Effect</label>
                  <Switch checked={glowEnabled} onCheckedChange={setGlowEnabled} />
                </div>

                <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset All
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors">
            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-10">
                {colors.map((color) => (
                  <motion.button
                    key={color.name}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveColor(color.name)}
                    className={`relative w-full aspect-square rounded-2xl ${color.class} transition-all duration-200 ${
                      activeColor === color.name
                        ? "ring-4 ring-foreground/20 ring-offset-2 ring-offset-background"
                        : ""
                    }`}
                  >
                    <AnimatePresence>
                      {activeColor === color.name && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Star className="w-6 h-6 text-primary-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>

              <motion.div
                layout
                className={`rounded-2xl p-8 ${colorMap[activeColor]?.split(" ")[1] || "gradient-vibrant"} ${glowEnabled ? (colorMap[activeColor]?.split(" ")[0] || "shadow-glow-primary") : ""} transition-all duration-500`}
              >
                <h3 className="text-2xl font-bold font-display text-primary-foreground mb-2 capitalize">
                  {activeColor}
                </h3>
                <p className="text-primary-foreground/80 text-sm">
                  Click the swatches above to preview different color themes in real-time.
                </p>
                <div className="flex gap-2 mt-4">
                  <Badge className="bg-primary-foreground/20 text-primary-foreground border-none">
                    Active
                  </Badge>
                  <Badge className="bg-primary-foreground/10 text-primary-foreground border-none">
                    Theme
                  </Badge>
                </div>
              </motion.div>
            </div>
          </TabsContent>

          {/* Widgets Tab */}
          <TabsContent value="widgets">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Like Button Widget */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-6 shadow-soft text-center"
              >
                <p className="text-sm font-medium text-muted-foreground mb-4">Like Button</p>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={handleLike}
                  className="relative mx-auto mb-3 block"
                >
                  <AnimatePresence>
                    {liked && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [1, 1.5, 0], opacity: [1, 1, 0] }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Heart className="w-12 h-12 text-accent fill-accent" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Heart
                    className={`w-12 h-12 transition-colors duration-200 ${
                      liked ? "text-accent fill-accent" : "text-muted-foreground"
                    }`}
                  />
                </motion.button>
                <p className="text-2xl font-bold font-display text-card-foreground">{likes}</p>
              </motion.div>

              {/* Progress Widget */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-soft"
              >
                <p className="text-sm font-medium text-muted-foreground mb-4">Progress</p>
                <div className="space-y-4">
                  <Progress value={progress} className="h-3" />
                  <Slider
                    value={[progress]}
                    onValueChange={([v]) => setProgress(v)}
                    max={100}
                    min={0}
                    step={1}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold font-display text-card-foreground">{progress}%</span>
                    <Flame className={`w-6 h-6 transition-colors ${progress > 80 ? "text-coral" : "text-muted-foreground"}`} />
                  </div>
                </div>
              </motion.div>

              {/* Badge Collection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl p-6 shadow-soft"
              >
                <p className="text-sm font-medium text-muted-foreground mb-4">Badges</p>
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", "Tailwind", "Framer", "Vite", "Shadcn"].map((tech, i) => (
                    <motion.div
                      key={tech}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      whileHover={{ scale: 1.1, y: -2 }}
                    >
                      <Badge
                        variant="secondary"
                        className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        {tech}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default InteractivePlayground;
