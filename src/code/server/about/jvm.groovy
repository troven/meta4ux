package scorpio4.v1.api.shell

import javax.script.ScriptEngineManager;
import java.lang.management.ManagementFactory
import java.lang.management.MemoryMXBean
import java.lang.management.MemoryUsage

import static java.lang.Runtime.getRuntime

/**
 *
 * Internal Telemetry
 *
 * http://127.0.0.1:1180/api/about/self.groovy
 *
 */
def runtime = getRuntime();
MemoryMXBean memBean = ManagementFactory.getMemoryMXBean();
MemoryUsage heap = memBean.getHeapMemoryUsage();
MemoryUsage nonHeap = memBean.getNonHeapMemoryUsage();
def toMB = { return it / (1024*1024) }
def about = [
        jvm: [
                cores: runtime.availableProcessors(),
                free: toMB(runtime.freeMemory() ),
                total: toMB(runtime.totalMemory() ),
                max: toMB(runtime.maxMemory() ),
                allocated: toMB(runtime.totalMemory() - runtime.freeMemory() ),
                available: toMB(runtime.maxMemory() - (runtime.totalMemory() - runtime.freeMemory()) ),
                heap: heap,
                non_heap: nonHeap
        ],
        disk: [:],
]

File[] roots = File.listRoots();
roots.each { it ->
    about.disk.total = toMB(it.getTotalSpace())
    about.disk.free = toMB(it.getFreeSpace())
    about.disk.usable = toMB(it.getUsableSpace())
}

about.scripting=[:]
def sem = new ScriptEngineManager();
def sef = sem.getEngineFactories();
sef.each {
    about.scripting[it.languageName] = [ name: it.languageName, extensions: it.extensions, version: it.languageVersion]
}

return about;
