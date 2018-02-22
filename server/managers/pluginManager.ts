import { RouterRegistry } from './RouterRegistry'
import { Manifest, IPluginManifest } from '../models/Manifest'
import { ExtPlugin } from '../models/Plugin'
import { IRouterConstructor, IServerConstructor } from '../interfaces';

export class PluginManager {
	private static instance: PluginManager;
	private static _pluginInstances: any = {};
	private readonly pluginClassName = 'ExtPlugin';
	private readonly pluginFilePath = 'server/plugin.js';

	public static async load(config: any) {
		for (let plugin of config.plugins) {
			await PluginManager.loadPlugin(plugin, config);
			console.log('=====> ' + plugin.id + ' plugin loaded');
		}
	}

	public static getPluginManifest(pluginId: string): Manifest {
		return PluginManager._pluginInstances.find((plugin) => {
			return plugin.id === pluginId;
		});
	}

	public static getPlugin(pluginId: string) : any {
		return PluginManager._pluginInstances[pluginId];
	}

	public static async loadPlugin(plugin: any, config: any) {

		try {
			const pluginId = plugin.id;
			const pluginManifest = await import(config.pluginBasePath + pluginId + '/manifest');
			const manifest = Manifest.fromJSON(<IPluginManifest> pluginManifest.manifest);
			
			let pluginFile = await import(config.pluginBasePath + pluginId + '/server');
			
			let pluginClass = <IServerConstructor> pluginFile.Server;
			let pluginInstance = new pluginClass(config, manifest);
			PluginManager._pluginInstances[pluginId] = pluginInstance;
			
			let router = RouterRegistry.getRouter(manifest);
			let pluginRouter = await import(config.pluginBasePath + pluginId + '/routes');
			pluginRouter = <IRouterConstructor>pluginRouter.Router;
			const routerInstance = new pluginRouter();
			routerInstance.init(router, manifest);

		} catch (e) {
			console.log(e);
		}
	}
}