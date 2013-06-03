desc "Imports system packages to update"
namespace :import do
  task :updates => :environment do
    # Supported formats = apt, yum
    Dir.glob("data/update/*").each do |file|
      next unless file.match /\.(apt|yum)$/
      servername = File.basename(file).gsub(/\.(apt|yum)$/, "")
      format = $1
      server = Server.find_or_generate(servername)
      lines = File.readlines(file)
      # apt
      if format == "apt"
        next if lines.count < 2
        packages = lines.grep(/ => /).map(&:strip).map do |line|
          if line.match /^(\S+)\s+\((\S+) => (\S+)\)/
            #puts "server:#{servername}, package:#{$1}, from:#{$2}, to:#{$3}"
            pkg = {name: $1, old: $2, new: $3}
            name = pkg[:name]
            status = "normal"
            status = "needing_reboot" if name.match(/^linux-(base|image)/)
            status = "important" if name.match(/^apache2|^bind9$|^firmware-|^heartbeat/)
            status = "important" if name.match(/^ldirector|^libc\d|-(scn|sen)$|^mysql-server/)
            status = "important" if name.match(/^openssh-server|^php5|^postfix|^postgresql-\d/)
            status = "important" if name.match(/^puppet$|^clamav/)
            pkg[:status] = status
            pkg.stringify_keys
          end
        end.compact
      # yum
      else
        packages = lines.grep(/^\S+\s+\d/).map(&:strip).map do |line|
          if line.match /^(\S+)\s+(\S+\.\S+)/
            #puts "server:#{servername}, package:#{$1}, from:#{$2}, to:#{$3}"
            pkg = {name: $1, old: "", new: $2}
            name = pkg[:name]
            status = "normal"
            status = "needing_reboot" if name.match(/^kernel/)
            status = "important" if name.match(/^httpd|^bind/)
            status = "important" if name.match(/^ldirector|^glibc-\d/)
            status = "important" if name.match(/^openssh-server/)
            status = "important" if name.match(/^puppet$/)
            pkg[:status] = status
            pkg.stringify_keys
          end
        end.compact
      end
      upgrade = Upgrade.find_or_create_by(server_id: server.id, strategy: format)
      upgrade.packages_list = packages
      if upgrade.changed?
        upgrade.upgraded_status = false
        upgrade.upgrader = nil
      end
      upgrade.updated_at = Time.now
      upgrade.save
    end
  end
end
