# Add content negotiation to the public site in both bundled and mounted nginx configurations.
# The source config is read afresh on each startup, so this transformation is repeatable.
/^[[:space:]]*server[[:space:]]*\{/ { site = 0 }
/^[[:space:]]*server_name[[:space:]]+avalon-game\.com[[:space:]]*;/ { site = 1 }
site && /^[[:space:]]*location = \/404\/index\.html[[:space:]]*\{/ {
  print
  print "      add_header Vary Accept always;"
  print "      set $avalon_markdown 0;"
  print "      if ($http_accept ~* \"(^|,)[[:space:]]*text/markdown([[:space:]]*(;|,|$))\") { set $avalon_markdown 1; }"
  print "      if ($http_accept ~* \"text/markdown[^,]*;[[:space:]]*q=0(\\.0*)?([[:space:]]*[,;]|$)\") { set $avalon_markdown 0; }"
  print "      if ($avalon_markdown = 1) {"
  print "        rewrite ^ /404.md last;"
  print "      }"
  next
}
site && /^[[:space:]]*location \/[[:space:]]*\{/ {
  print "    location = /404.md {"
  print "      internal;"
  print "      types { text/markdown md; }"
  print "      default_type text/markdown;"
  print "      add_header Vary Accept always;"
  print "      add_header X-Robots-Tag \"noindex, follow\" always;"
  print "      try_files $uri =404;"
  print "    }"
  print "    location = / {"
  print "      add_header Cache-Control \"no-cache\" always;"
  print "      add_header Vary Accept always;"
  print "      set $avalon_markdown 0;"
  print "      if ($http_accept ~* \"(^|,)[[:space:]]*text/markdown([[:space:]]*(;|,|$))\") { set $avalon_markdown 1; }"
  print "      if ($http_accept ~* \"text/markdown[^,]*;[[:space:]]*q=0(\\.0*)?([[:space:]]*[,;]|$)\") { set $avalon_markdown 0; }"
  print "      if ($avalon_markdown = 1) {"
  print "        rewrite ^ /home.md last;"
  print "      }"
  print "      try_files /index.html =404;"
  print "    }"
  print "    location = /home.md {"
  print "      internal;"
  print "      types { text/markdown md; }"
  print "      default_type text/markdown;"
  print "      add_header Cache-Control \"no-cache\" always;"
  print "      add_header Vary Accept always;"
  print "      try_files $uri =404;"
  print "    }"
}
{ print }
