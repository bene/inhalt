#!/usr/bin/env bun

import { getComponents } from "../src/common/components";
import { getConfig } from "../src/common/config";

const config = await getConfig();
const components = await getComponents(config);
