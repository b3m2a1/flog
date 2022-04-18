---
layout: null
---
{% comment %} site generating code pulled from JustTheDocs {% endcomment %}
var tipuesearch = { pages: [
  {% assign comma = false %}
  {% for page in site.html_pages %}{% if page.search_exclude != true %}{% if comma == true%},{% endif %} {
    "title": "{{ page.title | replace: '&amp;', '&' }}",
    "text": "{{ page.content | markdownify | replace: '</h', ' . </h' | replace: '<hr', ' . <hr' | replace: '</p', ' . </p' | replace: '</ul', ' . </ul' | replace: '</tr', ' . </tr' | replace: '</li', ' | </li' | replace: '</td', ' | </td' | strip_html | escape_once | remove: 'Table of contents' | remove: '```'  | remove: '---' | replace: '\', ' ' | replace: ' .  .  . ', ' . ' | replace: ' .  . ', ' . ' | normalize_whitespace }}",
    "url": "{{ page.url | absolute_url }}"
  }{% assign comma = true %}
  {% endif %}{% endfor %}
 ]};
