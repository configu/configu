#!/usr/bin/env npx zx

import { ROOT_PATH, MINT_CONTENT, _ } from "./utils.mjs";

const INTEGRATIONS_PATH = path.join(ROOT_PATH, 'integrations');
const INTEGRATIONS_DATA_PATH = path.join(INTEGRATIONS_PATH, 'integrations.json');
const INTEGRATIONS_OVERVIEW_PATH = path.join(INTEGRATIONS_PATH, 'overview2.mdx');

const INTEGRATIONS_NAV = MINT_CONTENT.navigation.find(item => item.group === 'Integrations');

const INTEGRATIONS_DATA_CONTENT = await fs.readJson(INTEGRATIONS_DATA_PATH);
const INTEGRATIONS_GROUPS = _(INTEGRATIONS_DATA_CONTENT).values().groupBy('group').value();

const getIntegrationOverviewCard = ({label, icon, docs}) => `  <Card
    title="${label}"
    icon={<img alt="${label} Icon" noZoom src="${icon}" />}
    href="${docs}"
    />`

const printedGroups = [];
const integrationsOverviewContent = `---
title: Overview
description: Learn how to integrate Configu into your project.
---

import { Construction } from '/snippets/callouts.mdx'

<Construction />

${_(INTEGRATIONS_GROUPS).values().map((integGroup) => {
  let content = ``;

  integGroup.forEach((integ, idx) => {
    const { group } = integ;

    if(idx === 0) {
      if (group[0] && !printedGroups.includes(group[0])) {
        content = `## ${group[0]}\n\n`;
        printedGroups.push(group[0]);
      }
      if (group[1] && !printedGroups.includes(group[1])) {
        content = `${content}### ${group[1]}\n\n`;
        printedGroups.push(group[1]);
      }

      const cols = group.includes('Configu') ? 1 : 4;
      content = `${content}<CardGroup cols={${cols}}>\n`;
    }

    content = `${content}${getIntegrationOverviewCard(integ)}\n`;

    if (idx === integGroup.length - 1) {
      content = `${content}</CardGroup>\n`;
    }
  });

  return content;
}).join('\n')}`

await fs.writeFile(INTEGRATIONS_OVERVIEW_PATH, integrationsOverviewContent, { flag: 'w' });
