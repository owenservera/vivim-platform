"use client"

import { motion } from "framer-motion"
import { Github, Heart, ExternalLink } from "lucide-react"

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="border-t bg-muted/50"
    >
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">V</span>
              </div>
              <span className="font-bold text-xl">VIVIM</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your Personal AI Memory Platform. Own, share, and evolve your AI systems.
            </p>
            <div className="flex items-center space-x-4">
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                href="https://github.com/owenservera/vivim-app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <Github className="h-5 w-5" />
              </motion.a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/repository" className="text-muted-foreground hover:text-foreground">
                  Repository
                </a>
              </li>
              <li>
                <a href="/issues" className="text-muted-foreground hover:text-foreground">
                  Issues
                </a>
              </li>
              <li>
                <a href="/pull-requests" className="text-muted-foreground hover:text-foreground">
                  Pull Requests
                </a>
              </li>
              <li>
                <a href="/contributors" className="text-muted-foreground hover:text-foreground">
                  Contributors
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/docs" className="text-muted-foreground hover:text-foreground">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/releases" className="text-muted-foreground hover:text-foreground">
                  Releases
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/owenservera/vivim-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  GitHub Repository
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* License */}
          <div>
            <h3 className="font-semibold mb-4">License</h3>
            <p className="text-sm text-muted-foreground">
              This project is licensed under the MIT License.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Built with ❤️ by the VIVIM Team
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VIVIM. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            <span>using Next.js and Tailwind CSS</span>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
