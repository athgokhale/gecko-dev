/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

extern crate euclid;
extern crate gleam;
extern crate glutin;
extern crate webrender;
extern crate winit;

#[path = "common/boilerplate.rs"]
mod boilerplate;

use boilerplate::{Example, HandyDandyRectBuilder};
use std::cmp;
use webrender::api::*;

struct App {
    rect_count: usize,
}

impl Example for App {
    fn render(
        &mut self,
        _api: &RenderApi,
        builder: &mut DisplayListBuilder,
        _txn: &mut Transaction,
        _framebuffer_size: FramebufferIntSize,
        pipeline_id: PipelineId,
        _document_id: DocumentId,
    ) {
        let bounds = (0, 0).to(1920, 1080);
        let info = LayoutPrimitiveInfo::new(bounds);
        let space_and_clip = SpaceAndClipInfo::root_scroll(pipeline_id);

        builder.push_simple_stacking_context(
            &info,
            space_and_clip.spatial_id,
        );

        for _ in 0 .. self.rect_count {
            builder.push_rect(&info, &space_and_clip, ColorF::new(1.0, 1.0, 1.0, 0.05));
        }

        builder.pop_stacking_context();
    }

    fn on_event(
        &mut self,
        event: winit::WindowEvent,
        _api: &RenderApi,
        _document_id: DocumentId
    ) -> bool {
        match event {
            winit::WindowEvent::KeyboardInput {
                input: winit::KeyboardInput {
                    state: winit::ElementState::Pressed,
                    virtual_keycode: Some(key),
                    ..
                },
                ..
            } => {
                match key {
                    winit::VirtualKeyCode::Right => {
                        self.rect_count += 1;
                        println!("rects = {}", self.rect_count);
                    }
                    winit::VirtualKeyCode::Left => {
                        self.rect_count = cmp::max(self.rect_count, 1) - 1;
                        println!("rects = {}", self.rect_count);
                    }
                    _ => {}
                };
            }
            _ => (),
        }

        true
    }
}

fn main() {
    let mut app = App {
        rect_count: 1,
    };
    boilerplate::main_wrapper(&mut app, None);
}
