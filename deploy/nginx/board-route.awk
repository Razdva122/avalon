# Upgrade the legacy mounted voice config without changing the host file.
# The existing support API identifies the application server and its upstream.
{
    lines[NR] = $0
    if ($0 ~ /^[ \t]*location[ \t]+(\^~[ \t]+)?\/api\/player-boards\/?[ \t]*\{/) boards++
    if ($0 ~ /^[ \t]*location[ \t]+(\^~[ \t]+)?\/api\/support\/?[ \t]*\{[ \t]*$/) {
        anchors++
        anchor = NR
        inside = 1
        indent = $0
        sub(/[^ \t].*$/, "", indent)
    } else if (inside && $0 ~ /^[ \t]*\}[ \t]*$/) {
        inside = 0
    } else if (inside && $0 ~ /^[ \t]*proxy_pass[ \t]+[^;]+;[ \t]*$/) {
        upstreams++
        upstream = $0
        sub(/^[ \t]*/, "", upstream)
    }
}
END {
    if (!boards && (anchors != 1 || upstreams != 1)) {
        print "Avalon: cannot add board API: expected one support API location with one proxy_pass." > "/dev/stderr"
        exit 1
    }
    for (i = 1; i <= NR; i++) {
        if (!boards && i == anchor) {
            print indent "# Avalon board API compatibility route"
            print indent "location ^~ /api/player-boards {"
            print indent "  " upstream
            print indent "  proxy_set_header Host $host;"
            print indent "  proxy_set_header X-Forwarded-Proto $scheme;"
            print indent "  proxy_set_header X-Forwarded-For $remote_addr;"
            print indent "  client_max_body_size 8k;"
            print indent "  proxy_read_timeout 20s;"
            print indent "}"
        }
        print lines[i]
    }
}
