class MappingLineElement extends Element {
  constructor(escenicSection, cueSection, cueThemepage) {
    super('div', `
<div class="mapping" id="$escenic-section-id" dataa-line="1">
  <div class="publication">bmo</div>
  <div class="ece">
    <span class="name">sectinoname</span>
    <span class="url"><a href="url">url</a></span>
    <input type="hidden" name="$esid+escenic_id" id="$esid+escenic_id"/>
  </div>
  <div class="cue">
    <div class="type">
      <input type="radio" id="$esid+type_section" name="$esid+type" value="section"/>
      <label for="$esid+type_section">Section</label>
      <input type="radio" id="$esid+type_themepage" name="$esid+type" value="themepage"/>
      <label for="$esid+type_themepage">Themenseite</label>
    </div>
    <div class="name">
      <input type="text" id="$esid+cue_selector"/>
      <input type="hidden" name="$esid+cue_id" id="cue_id"/>
    </div>
  </div>
</div>


`
    
  }
}